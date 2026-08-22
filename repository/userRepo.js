const db = require("../models/index");

exports.createUser = async (data) => {
  return await db.userModel.create(data);
};

exports.findUserByEmail = async (email) => {
  return await db.userModel.findOne({
    where: { email: email.toLowerCase() },
  });
};

exports.findUserByResetToken = async (resetToken) => {
  return await db.userModel.findOne({
    where: { resetToken },
  });
};

exports.updateUser = async (userId, updateData) => {
  const user = await db.userModel.findByPk(userId);
  if (!user) return null;
  try {
    return await user.update(updateData);
  } catch (err) {
    if (err.message && (err.message.includes("Unknown column") || err.message.includes("otp_code") || err.message.includes("otp_expires"))) {
      try {
        await db.sequelize.query("ALTER TABLE `users` ADD COLUMN `otp_code` VARCHAR(6) NULL;");
      } catch (e) {}
      try {
        await db.sequelize.query("ALTER TABLE `users` ADD COLUMN `otp_expires` DATETIME NULL;");
      } catch (e) {}
      return await user.update(updateData);
    }
    throw err;
  }
};

exports.getAllCompanies = async () => {
  const Sequelize = require("sequelize");
  return await db.userModel.findAll({
    where: {
      role: {
        [Sequelize.Op.in]: ["admin", "company"],
      },
    },
    include: [
      {
        model: db.profileModel,
        as: "profile",
        required: false,
      },
    ],
    order: [["createdAt", "DESC"]],
  });
};


exports.softDeleteUser = async (userId) => {
  const user = await db.userModel.findByPk(userId);
  if (!user) return null;
  return await user.update({ isActive: false });
};

exports.hardDeleteUser = async (userId) => {
  const user = await db.userModel.findByPk(userId);
  if (!user) return null;
  await user.destroy();
  return user;
};

exports.restoreUser = async (userId) => {
  const user = await db.userModel.findByPk(userId);
  if (!user) return null;
  return await user.update({ isActive: true });
};

exports.getAllUsers = async (options = {}) => {
  const { search, role, status, sortBy = "createdAt", sortOrder = "DESC", page, limit } = options;
  const Sequelize = require("sequelize");
  const Op = Sequelize.Op;

  const where = {};

  // 1. Role filter
  if (role && role !== "all" && role !== "all_users") {
    if (role === "companies" || role === "company" || role === "admin") {
      where.role = { [Op.in]: ["admin", "company"] };
    } else if (role === "interviewers") {
      where.role = "interviewer";
    } else if (role === "candidates") {
      where.role = "candidate";
    } else {
      where.role = role;
    }
  }

  // 2. Status filter
  if (status === "active") {
    where.isActive = true;
  } else if (status === "inactive") {
    where.isActive = false;
  }

  // 3. Search query filter
  if (search && search.trim()) {
    const s = `%${search.trim().toLowerCase()}%`;
    const isPostgres = db.sequelize.getDialect() === "postgres";
    const likeOp = isPostgres ? Op.iLike : Op.like;

    where[Op.or] = [
      { email: { [likeOp]: s } },
      { username: { [likeOp]: s } },
    ];
  }

  // 4. Sorting
  const validSortCols = ["createdAt", "email", "role", "username", "isActive"];
  const col = validSortCols.includes(sortBy) ? sortBy : "createdAt";
  const orderDir = (sortOrder || "DESC").toUpperCase() === "ASC" ? "ASC" : "DESC";

  const queryOptions = {
    where,
    include: [
      {
        model: db.profileModel,
        as: "profile",
        required: false,
      },
      {
        model: db.companyModel,
        as: "companyProfile",
        required: false,
      },
      {
        model: db.interviewerModel,
        as: "interviewerProfile",
        required: false,
        include: [
          {
            model: db.companyModel,
            as: "company",
            required: false,
          },
        ],
      },
      {
        model: db.candidateModel,
        as: "candidateProfile",
        required: false,
      },
      {
        model: db.superAdminModel,
        as: "superAdminProfile",
        required: false,
      },
    ],
    order: [[col, orderDir]],
    distinct: true,
  };

  // 5. Pagination if limit is supplied
  if (limit && Number(limit) > 0) {
    const lim = Number(limit);
    const p = Math.max(1, Number(page) || 1);
    queryOptions.limit = lim;
    queryOptions.offset = (p - 1) * lim;

    const result = await db.userModel.findAndCountAll(queryOptions);
    return {
      users: result.rows,
      totalCount: result.count,
      currentPage: p,
      totalPages: Math.ceil(result.count / lim),
      limit: lim,
    };
  }

  const users = await db.userModel.findAll(queryOptions);
  return {
    users,
    totalCount: users.length,
  };
};
